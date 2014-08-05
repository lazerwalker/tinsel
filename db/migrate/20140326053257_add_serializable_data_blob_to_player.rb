class AddSerializableDataBlobToPlayer < ActiveRecord::Migration
  def change
    add_column :players, :data, :text
    remove_column :players, :score, :integer
    remove_column :players, :male, :boolean
  end
end
